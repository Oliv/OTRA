<?php
require_once 'class.Object.php';

class Building extends Object {
	public static $id = 'building_id';
	public static $table = 'otra_building';
	
    public function __construct($id, $properties = array()) {
		parent::__construct(self::$id, self::$table);

        if (count($properties)) {
            $this->properties = $properties;
        } else {
            $sql = "SELECT b.building_id, b.pos, b.react, b.owner, b.level, b.time, t.name, t.type, t.file, t.prize
                    FROM otra_building b
                    INNER JOIN otra_building_type t ON t.building_type_id = b.building_type_id
                    WHERE b.building_id = " . (int) $id;
            
			$this->properties = reset($this->db->read($sql));
        }
    }
	
	public static function factory($data, $idChar) {
		$db = new DB();

		$db->insert(self::$table, array(
			'building_type_id' => (int) $data['id'],
			'pos' => (int) $data['pos'],
			'react' =>1,
			'owner' => (int) $idChar,
			'level' => 1,
			'time' => time(),
		));
		
		return new Building($db->lastInsertId());
	}
    
	public static function getBuildings() {
		$db = new DB();
		
		$return = array();
		$sql = "SELECT b.building_id, b.pos, b.react, b.owner, b.level, b.time, t.name, t.type, t.file, t.prize
				FROM otra_building b
				INNER JOIN otra_building_type t ON t.building_type_id = b.building_type_id";
		
		foreach ($db->read($sql) as $v) {
			$return[$v['pos']] = new Building($v[self::$id], $v);
		}
		
		return $return;
	}
	
	public static function getPrize($type) {
		$db = new DB();
		
		$sql = "SELECT prize FROM otra_building_type WHERE building_type_id = " . (int) $type;

		if ($v = $db->read($sql)) return $v['prize'];
		
		return 0;
	}
    
    public function __destruct() {
        $this->db->update(self::$table, $this->getProperties(array('pos', 'react', 'owner', 'level')), $this->id(), 'building_id');

        parent::__destruct();
    }
}