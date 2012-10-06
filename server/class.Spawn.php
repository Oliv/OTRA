<?php
require_once 'class.Object.php';

class Spawn extends Object {
	public static $id = 'spawn_id';
	public static $table = 'otra_spawn';

    public function __construct($id, $properties = array()) {
		parent::__construct(self::$id, self::$table);

        if (count($properties)) {
            $this->properties = $properties;
        } else {
            $sql = "SELECT m.mob_id, m.name, m.file, m.level, m.exp, m.str, m.agi, m.int, m.cha,
						m.max_hp, m.max_sp, m.max_hp AS hp, m.max_sp AS sp, s.pos AS x, 5 AS y,
						s.spawn_id, s.pos, s.frequency
					FROM otra_spawn
					INNER JOIN otra_mob m ON m.mob_id = s.mob_id WHERE spawn_id = " . (int) $id;

			$this->properties = reset($this->db->read($sql));
        }

        $this->scroll = floor($this->pos / Server::SCREEN_WIDTH);
    }

	public static function getSpawns() {
		$db = new DB();

		$return = array();
		$sql = "SELECT m.mob_id, m.name, m.file, m.level, m.exp, m.str, m.agi, m.int, m.cha,
				m.max_hp, m.max_sp, m.max_hp AS hp, m.max_sp AS sp, s.pos AS x, 5 AS y,
				s.spawn_id, s.pos, s.frequency
			FROM otra_spawn s
			INNER JOIN otra_mob m ON m.mob_id = s.mob_id";

		foreach ($db->read($sql) as $v) {
			$return[$v['spawn_id']] = new Spawn($v['spawn_id'], $v);
		}

		return $return;
	}
}