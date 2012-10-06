<?php
require_once 'class.DB.php';

class Object {
	public static $id = '';
	public static $table = '';

    protected $properties = array();
	protected $db;

    public function __construct($id, $table) {
		$this->db = new DB();

		self::$id = $id;
		self::$table = $table;
    }

    public function __get($k) {
        if (isset($this->properties[$k]))
            return $this->properties[$k];

        return null;
    }

    public function __set($k, $v) {
        $this->properties[$k] = $v;
    }

    public function id() {
        return (int) $this->__get(self::$id);
    }

    public function getProperties($restrict = array()) {
        if (count($restrict)) {
            return array_intersect_key($this->properties, array_flip($restrict));
        } else {
            return $this->properties;
        }
    }

    public function __destruct() {
        foreach ($this as $key => $value) {
            unset($this->$key);
        }
    }
}