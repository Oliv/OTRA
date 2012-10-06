<?php
/**
 * Format de réponse
 *
 * data: {
        fn // fonctions à éxécuter
        el // éléments à mettre à jour
        prop // propriétés à mettre à jour
        msg // messages à afficher
 }
 *
 * data.fn: [{
        name // nom de la fonction (séparateur "/" pour accéder à un namespace)
        set // propriétés
 }]
 * 
 * data.el: [{
        name // selecteur
        set // propriétés
 }]
 * 
 * data.prop: [{
        name // nom de la propriété
        set // valeur
 }]
 * 
 * data.msg: [{
        type // type de message
        title // titre du message
        html // contenu du message
 }]
 * 
 **/

class Response {
    private $properties;

    public function __construct() {}
    
    public function __get($k) {
        if (isset($this->properties[$k]))
            return $this->properties[$k];
        
        return null;
    }
    
    public function hasResponses() {
        return count($this->properties);
    }
    
    public function addFn($name, $set) {
        $this->properties['fn'][] = array('name' => $name, 'set' => $set);
    }
    
    public function addProp($name, $set) {
        $this->properties['prop'][] = array('name' => $name, 'set' => $set);
    }
    
    public function addEl($name, $set) {
        $this->properties['el'][] = array('name' => $name, 'set' => $set);
    }
    
    public function addMsg($type, $title, $html) {
        $this->properties['msg'][] = array('class' => $type, 'name' => $title, 'msg' => $html);
    }
    
    public function __toString() {
        return json_encode($this->properties);
    }
}