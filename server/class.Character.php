<?php
require_once 'class.Object.php';

class Character extends Object {
	public static $id = 'char_id';
	public static $table = 'otra_character';
	
    private $clientID;
    private $inventory = array();

    public function __construct($clientID, $id, $properties = array(), $inventory = array()) {
		parent::__construct(self::$id, self::$table);
        
		$this->clientID = $clientID;

        if (count($properties)) {
            $this->properties = $properties;
        } else {
            $sql = "SELECT c.account_id, c.char_id, c.name, c.file, cl.name AS class, c.level, c.exp, c.money, c.str, c.agi, c.int, c.cha,
                    c.x_max, c.max_hp, c.hp, c.max_sp, c.sp, c.status_point, c.skill_point, c.x, c.y, cla.name AS clan_name
                    FROM otra_character c
                    INNER JOIN otra_class cl ON cl.class_id = c.class_id
                    LEFT JOIN otra_clan cla ON cla.clan_id = c.clan_id
                    WHERE c.char_id = " . (int) $id;

            if ($this->properties = reset($this->db->read($sql))) {
                $this->db->exec("UPDATE otra_character
                        SET online = 1
                        WHERE account_id = " . (int) $this->account_id);
            }
        }

        if (count($inventory)) {
            $this->inventory = $inventory;
        } else {
            $sql = "SELECT i.item_id, i.pos, i.amount, i.identify, i.refine, it.name, it.class, it.level, it.file, it.params, it.desc
                    FROM otra_inventory i
                    INNER JOIN otra_item it ON it.item_id = i.item_id
                    WHERE i.char_id = " . $this->id();

            foreach ($this->db->read($sql) as $item) {
                $this->inventory[$item['pos']] = array(
                    'id'        => $item['item_id'],
                    'pos'       => $item['pos'],
                    'identify'  => $item['identify'],
                    'refine'    => $item['refine'],
                    'amount'    => $item['amount'],
                    'name'      => $item['name'],
                    'class'     => $item['class'],
                    'level'     => $item['level'],
                    'file'      => $item['file'],
                    'desc'      => $item['desc'],
                    'params'    => json_decode($item['params'])
                );
        
                $sql = "SELECT s.name, s.param
                        FROM otra_stat s
                        WHERE s.item_id = " . (int) $this->inventory[$item['pos']]['id'];
        
                $this->inventory[$item['pos']]['stats'] = array();
        
                foreach ($this->db->read($sql) as $stat) {
                    $this->inventory[$item['pos']]['stats'][] = array(
                        'name' => $stat['name'],
                        'param' => json_decode($stat['param'], true)
                    );
                }
            }
        }

        $this->scroll = floor($this->x / Server::SCREEN_WIDTH);
    }
    
	private function getEmptyPlace() {
		$pos = null;
		for ($i = 10; $i < 135 && !$pos; $i++) {
			if (empty($this->inventory[$i])) {
				$pos = $i;
			}
		}
		
		return $pos;
	}
    
    public function getPublicProperties() {
        return $this->getProperties(array('char_id', 'name', 'file', 'class', 'level', 'exp', 'money', 'str', 'agi', 'int', 'cha',
            'x_max', 'max_hp', 'hp', 'max_sp', 'sp', 'x', 'y', 'clan_name'));
    }
    
    public function getInventory() {
        return $this->inventory;
    }
	
	public function equip($data) {
		$response = new Response();

		if (isset($data['pos'])) {
			$prePos = (int) $data['pos'];
			if (!empty($this->inventory[$prePos]) && !empty($this->inventory[$prePos]['class'])) {
				$refPos = array(
					'Hat',
					'Earing',
					'Armor',
					'Weapon1',
					'Weapon2',
					'Ring',
					'Ring',
					'Cape',
					'Belt',
					'Boot',
				);

				$pos = array_search($this->inventory[$prePos]['class'], $refPos);
				if ($pos !== null) {
					if (!empty($this->inventory[$pos])) {
						$tmpPos = $this->inventory[$pos];
						$this->inventory[$pos] = $this->inventory[$prePos];
						$this->inventory[$prePos] = $tmpPos;

						$this->inventory[$pos]['pos'] = $pos;
						$this->inventory[$prePos]['pos'] = $prePos;
					} else {
						$this->inventory[$pos] = $this->inventory[$prePos];
						unset($this->inventory[$prePos]);

						$this->inventory[$pos]['pos'] = $pos;
					}

					$response->addFn('equipResponse', array(
						'pos' => $pos,
						'prePos' => $prePos,
						'item' => $this->inventory[$pos],
					));

					$response->addMsg('message', 'Information', 'L\'objet a bien été équipé');
				} else {
					$response->addMsg('error', 'Erreur', 'L\'objet ne peut pas être équipé');
				}
			} else {
				$response->addMsg('error', 'Erreur', 'L\'objet n\'existe pas');
			}
		} else {
			$response->addMsg('error', 'Erreur', 'Une erreur est survenue');
		}
		
		return $response;
	}
	
	public function unequip($data) {
		$response = new Response();

		if (isset($data['pos'])) {
			$prePos = (int) $data['pos'];
	
			if (!empty($this->inventory[$prePos])) {	
				if ($pos = $this->getEmptyPlace()) {
					$this->inventory[$pos] = $this->inventory[$prePos];
					unset($this->inventory[$prePos]);

					$this->inventory[$pos]['pos'] = $pos;
					
					$response->addFn('unequipResponse', array(
						'pos' => $pos,
						'prePos' => $prePos,
						'item' => $this->inventory[$pos],
					));

					$response->addMsg('message', 'Information', 'L\'objet a bien été déséquipé');
				} else {
					$response->addMsg('error', 'Erreur', 'L\'inventaire est plein');
				}
			} else {
				$response->addMsg('error', 'Erreur', 'L\'objet n\'existe pas');
			}
		} else {
			$response->addMsg('error', 'Erreur', 'Une erreur est survenue');
		}
		
		return $response;
	}
	
	public function destroy($data) {
		$response = new Response();
	
		if (isset($data['pos']) && !empty($this->inventory[$data['pos']])) {
			$pos = (int) $data['pos'];
		
			unset($this->inventory[$pos]);
	
			$response->addFn('destroyResponse', array(
				'pos' => $pos,
				'item' => $this->inventory[$pos],
			));

			$response->addMsg('message', 'Information', 'L\'objet a bien été supprimé');
		} else {
			$response->addMsg('error', 'Erreur', 'Une erreur est survenue');
		}
		
		return $response;
	}
	
	public function buy($id) {
		$response = new Response();
	
		$sql = "SELECT it.item_id, it.name, it.class, it.level, it.file, it.params, it.prize, it.desc
				FROM otra_item it
				WHERE it.item_id = " . (int) $id;

		if ($row = reset($this->db->read($sql))) {
			if ($row['prize'] <= $this->money) {
				if ($pos = $this->getEmptyPlace()) {
					$this->money -= (int) $row['prize'];

					$this->inventory[$pos] = array(
						'id' => $row['item_id'],
						'pos' => $pos,
						'identify' => 0,
						'refine' => 0,
						'amount' => 1,
						'name' => $row['name'],
						'class' => $row['class'],
						'level' => $row['level'],
						'file' => $row['file'],
						'params' => null,
						'stats' => array(),
						'desc' => $row['desc']
					);

					$response->addFn('buyResponse', array(
						'money' => $this->money,
						'item' => $this->inventory[$pos],
					));
		
					$response->addMsg('message', 'Information', 'Achat effectué');
				}
			} else {
				$response->addMsg('error', 'Erreur', 'Vous n\'avez pas assez d\'argent');
			}
		} else {
			$response->addMsg('error', 'Erreur', 'L\'objet n\'existe pas');
		}
		
		return $response;
	}
    
    public function __destruct() {
        $this->db->update(self::$table, $this->getProperties(array('name', 'level', 'exp', 'money', 'str', 'agi', 'int', 'cha',
            'x_max', 'max_hp', 'hp', 'max_sp', 'sp', 'x', 'y')) + array('online' => 0), $this->id(), self::$id);

		$this->db->delete('otra_inventory', 'char_id = ' . $this->id());
		foreach ($this->inventory as $k => $v) {
			$this->db->insert('otra_inventory', array('char_id' => $this->id(), 'item_id' => $v['id'], 'pos' => $v['pos'], 'amount' => $v['amount'], 'identify' => $v['identify'], 'refine' => $v['refine']));
		}

        parent::__destruct();
    }
}