<?php
// Prevent the server from timing out
set_time_limit(0);

// Include the web sockets server script (the server is started at the far bottom of this file)
require_once 'class.DB.php';
require_once 'class.PHPWebSocket.php';
require_once 'class.Response.php';
require_once 'class.Character.php';
require_once 'class.Building.php';
require_once 'class.Spawn.php';

class Server extends PHPWebSocket {
	const ROOT_PATH = '/var/www/otra/';
	const PUBLIC_PATH = '/var/www/otra/public/fr/';
	const SCREEN_WIDTH = 32;
	const SCREEN_WIDTH_PX = 1024;

	protected $db;

	private $characters = array();
	private $spawns = array();
	private $buildings = array();

	public function __construct() {
		parent::__construct();

		$this->db = new DB();

		$this->buildings = Building::getBuildings();

		$this->spawns = Spawn::getSpawns();
		foreach ($this->spawns as $spawn) {
			$this->wsTimers[] = array(
				'function' => 'mobMove',
				'current' => time(),
				'inc' => array('min' => 10, 'max' => 15),
				'id' => $spawn->id(),
			);
		}
	}

	protected function wsOnMessage($clientID, $message, $messageLength, $binary) {
		// Check message length
		if ($messageLength == 0) {
			$this->wsClose($clientID);
			return;
		}

		// Process messages
		if (!empty($message['fn']) && method_exists($this, $message['fn']) && is_callable(array($this, $message['fn']))) {
			$this->log("Client $clientID called " . $message['fn'] . ", params: " . json_encode(isset($message['data']) ? $message['data'] : "No params"));
			$fn = $message['fn'];

			if (isset($message['data'])) {
				$this->$fn($clientID, $message['data']);
			} else {
				$this->$fn($clientID);
			}
		}
	}

	protected function wsOnOpen($clientID) {
		$ip = long2ip($this->wsClients[$clientID]['IPv4']);
		$this->log("$ip ($clientID) has connected.");
	}

	protected function wsOnClose($clientID, $status) {
		$ip = long2ip($this->wsClients[$clientID]['IPv4']);
		$this->log("$ip ($clientID) has disconnected.");

		// Send the character disconnect to everyone
		if (!empty($this->characters[$clientID])) {
			$response = new Response();
			$response->addFn('removeChar', $this->characters[$clientID]->id());

			foreach ($this->wsClients as $id => $client) {
				if ($id != $clientID) {

					$this->wsSend($id, $response);
				}
			}

			// destroy character serverside TODO: and save it
			unset($this->characters[$clientID]);
		}
	}

	private function getAreaClients($scroll) {
		$return = array();

		foreach ($this->characters as $id => $char) {
			if ($char->scroll == $scroll) {
				$return[] = $id;
			}
		}

		return $return;
	}

	private function getAreaSpawns($scroll) {
		$return = array();

		foreach ($this->spawns as $id => $spawn) {
			if ($spawn->pos >= $scroll * self::SCREEN_WIDTH && $spawn->pos < $scroll * self::SCREEN_WIDTH + self::SCREEN_WIDTH) {
				$return[] = $id;
			}
		}

		return $return;
	}

	private function getAreaBuildings($scroll) {
		$return = array();

		$nb = round(self::SCREEN_WIDTH_PX / 128);

		foreach ($this->buildings as $id => $building) {
			if ($building->pos >= $nb * $scroll && $building->pos < $nb * $scroll + $nb) {
				$return[] = $id;
			}
		}

		return $return;
	}

	public function connect($clientID, $data) {
		// character loading
		$this->characters[$clientID] = new Character($clientID, $data['char_id']);


		// Send the public character to everyone in the area
		$areaClients = $this->getAreaClients($this->characters[$clientID]->scroll);

		foreach ($this->wsClients as $id => $client) {
			$response = new Response();

			if ($id != $clientID && in_array($id, $areaClients)) {
				$response->addFn('addChar', $this->characters[$clientID]->getPublicProperties());
			}

			$this->wsSend($id, $response);
		}

		// Send the full character to the person who's connecting, and chars already connected
		$response = new Response();
		$response->addFn('init', array_merge($this->characters[$clientID]->getProperties(), array('inventory' => $this->characters[$clientID]->getInventory())));

		foreach ($this->wsClients as $id => $client) {
			if ($id != $clientID && in_array($id, $areaClients)) {
				$response->addFn('addChar', $this->characters[$id]->getPublicProperties());
			}
		}

		// buildings
		$areaBuildings = $this->getAreaBuildings($this->characters[$clientID]->scroll);

		foreach ($this->buildings as $pos => $v) {
			if (in_array($pos, $areaBuildings)) {
				$response->addFn('addTile', $v->getProperties());
			}
		}

		// spawns
		$areaSpawns = $this->getAreaSpawns($this->characters[$clientID]->scroll);

		foreach ($this->spawns as $pos => $v) {
			if (in_array($pos, $areaSpawns)) {
				$response->addFn('addSpawn', $v->getProperties());
			}
		}
		$this->wsSend($clientID, $response);
	}

	public function moveChar($clientID, $data) {

		$areaClients = $this->getAreaClients($this->characters[$clientID]->scroll);

		// Save the move
		$this->characters[$clientID]->x = $data['x'];
		$this->characters[$clientID]->y = $data['y'];

		$response = new Response();
		$response->addFn('moveChar', $data + array('id' => $this->characters[$clientID]->id()));

		// Send the move
		foreach ($this->wsClients as $id => $client)
			if ($id != $clientID && in_array($id, $areaClients))
				$this->wsSend($id, $response);
	}

	public function setCharThumb($clientID, $data) {
		if ($data === 'default') {
			copy(self::PUBLIC_PATH . 'jeu/chars/' . $this->characters[$clientID]->file . '.png', self::PUBLIC_PATH . 'jeu/chars/thumb/' . $this->characters[$clientID]->id() . '.png');
		} else {
			$tmp = base64_decode(end(explode(',', $data)));
			file_put_contents(self::PUBLIC_PATH . 'jeu/chars/thumb/' . $this->characters[$clientID]->id() . '.png', $tmp);
		}

		$response = new Response();
		$response->addFn('drawCharEquips', $this->characters[$clientID]->id());

		// Send the message to everyone
		$areaClients = $this->getAreaClients($this->characters[$clientID]->scroll);
		foreach ($this->wsClients as $id => $client) {
			if (in_array($id, $areaClients))
				$this->wsSend($id, $response);
		}
	}

	public function setCharEquip($clientID, $data) {
		$this->wsSend($clientID, $this->characters[$clientID]->equip($data));
	}

	public function buy($clientID, $data) {
		$this->wsSend($clientID, $this->characters[$clientID]->buy($data));
	}

	public function setCharDestroy($clientID, $data) {
		$this->wsSend($clientID, $this->characters[$clientID]->destroy($data));
	}

	public function setCharUnequip($clientID, $data) {
		$this->wsSend($clientID, $this->characters[$clientID]->unequip($data));
	}

	public function changeMap($clientID, $data) {
		$responseSelf = new Response();

		$this->characters[$clientID]->x = $data > 0
			? ($this->characters[$clientID]->scroll + $data) * self::SCREEN_WIDTH + 2
			: ($this->characters[$clientID]->scroll + $data) * self::SCREEN_WIDTH + self::SCREEN_WIDTH - 3;

		// Send to old area users that the character moved
		$response = new Response();
		$response->addFn('removeChar', $this->characters[$clientID]->id());

		$areaClients = $this->getAreaClients($this->characters[$clientID]->scroll);
		foreach ($this->wsClients as $id => $client) {
			if (in_array($id, $areaClients) && $id != $clientID) {
				$this->wsSend($id, $response);
				$responseSelf->addFn('removeChar', $this->characters[$id]->id());
			}

		}

		// send to new area users that the character's coming
		$this->characters[$clientID]->scroll += $data;
		if ($this->characters[$clientID]->scroll < 0)
			$this->characters[$clientID]->scroll = 0;

		$response = new Response();
		$response->addFn('addChar', $this->characters[$clientID]->getPublicProperties());

		$areaClients = $this->getAreaClients($this->characters[$clientID]->scroll);
		foreach ($this->wsClients as $id => $client) {
			if (in_array($id, $areaClients) && $id != $clientID)
				$this->wsSend($id, $response);
		}

		// buildings
		$areaBuildings = $this->getAreaBuildings($this->characters[$clientID]->scroll);
		foreach ($this->buildings as $pos => $v) {
			if (in_array($pos, $areaBuildings)) {
				$responseSelf->addFn('addTile', $v->getProperties());
			}
		}
		foreach ($this->wsClients as $id => $client) {
			if (in_array($id, $areaClients) && $id != $clientID)
				$responseSelf->addFn('addChar', $this->characters[$id]->getPublicProperties());
		}
		$responseSelf->addFn('changeMap', $this->characters[$clientID]->scroll);


		// spawns
		$areaSpawns = $this->getAreaSpawns($this->characters[$clientID]->scroll);

		foreach ($this->spawns as $pos => $v) {
			if (in_array($pos, $areaSpawns)) {
				$responseSelf->addFn('addSpawn', $v->getProperties());
			}
		}

		$this->wsSend($clientID, $responseSelf);
	}

	public function clientsMap($clientID) {
		$areaClients = $this->getAreaClients($this->characters[$clientID]->scroll);
		$response = new Response();

		foreach ($this->wsClients as $id => $client) {
			if ($id != $clientID && in_array($id, $areaClients)) {
				$response->addFn('addChar', $this->characters[$id]->getPublicProperties());
			}
		}

		$this->wsSend($clientID, $response);
	}

	public function build($clientID, $data) {
		$areaClients = $this->getAreaClients($this->characters[$clientID]->scroll);
		$response = new Response();

		if (Building::getPrize($data['id']) <= $this->characters[$clientID]->money) {
			$build = Building::factory($data, $this->characters[$clientID]->id());
			$build->pos = $data['pos'];

			$this->characters[$clientID]->money -= (int) $build->prize;

			$this->buildings[$build->pos] = $build;
			$response->addFn('addTile', $build->getProperties());

			foreach ($this->wsClients as $id => $client) {
				if ($id != $clientID && in_array($id, $areaClients)) {
					$this->wsSend($id, $response);
				}
			}

			$response->addMsg('message', 'Information', 'Achat effectué');
		} else {
			$response->addMsg('error', 'Erreur', 'Vous n\'avez pas assez d\'argent');
		}

		$this->wsSend($clientID, $response);
	}

	public function chatMsg($clientID, $data) {
		// Build the response
		$response = new Response();
		$response->addFn('addChat', $data);

		// Send the message to everyone but the person who said it
		foreach ($this->wsClients as $id => $client)
			if ($id != $clientID)
				$this->wsSend($id, $response);
	}

	protected function mobMove($id) {
		if ($this->spawns[$id]) {
			$this->spawns[$id]->x += rand(-4, 4);
			$this->spawns[$id]->y += rand(-4, 4);

			if ($this->spawns[$id]->x < $this->spawns[$id]->scroll * Server::SCREEN_WIDTH + 3)
				$this->spawns[$id]->x = $this->spawns[$id]->scroll * Server::SCREEN_WIDTH + 3;
			if ($this->spawns[$id]->x > $this->spawns[$id]->scroll * Server::SCREEN_WIDTH + Server::SCREEN_WIDTH - 3)
				$this->spawns[$id]->x = $this->spawns[$id]->scroll * Server::SCREEN_WIDTH + Server::SCREEN_WIDTH - 3;
			if ($this->spawns[$id]->y < 0) $this->spawns[$id]->y = 0;
			if ($this->spawns[$id]->y > 9) $this->spawns[$id]->y = 9;

			$areaClients = $this->getAreaClients($this->spawns[$id]->scroll);

			foreach ($this->wsClients as $clientID => $client) {
				if (in_array($clientID, $areaClients)) {
					$response = new Response();

					$response->addFn('moveMob', $this->spawns[$id]->getProperties());

					$this->wsSend($clientID, $response);
				}
			}
		}
	}
}

// Start the server
$Server = new Server();
$Server->wsStartServer('oliv.hazlab.fr', 443);