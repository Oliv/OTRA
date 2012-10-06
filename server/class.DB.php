<?php
class DB extends PDO
{
    public function __construct() {
		$type   = 'mysql';
		$host   = 'localhost';
		$dbname = 'otra';
		$user   = 'root';       // Je sais c'est crade
		$pass   = '00d70c56';   // ...et moche mais bon on l'est ou on l'est pas
        
        try {
			parent::__construct($type . ':host=' . $host . ';dbname=' . $dbname, $user, $pass);
			$this->query('SET NAMES utf8');
		} catch(Exception $e) {
			return false;
		}
	}

	public function read($sql, $key = null) {
		$result = array();
		if ($res = $this->query($sql)) {
            if ($rows = $res->fetchAll(PDO::FETCH_ASSOC)) {
                if ($key && array_key_exists($key, reset($rows))) {
                    foreach($rows as $v) {
                        $result[$v[$key]] = $v;
                    }
                } else {
                    $result += $rows;
                }
            }
        }
        
        return $result;
	}

	public function write($sql) {
		$res = false;
        try {
            $res = $this->exec($sql);
        } catch (PDOException $e) {
            throw $this->errorInfo();
        }
        
        return $res;
	}

	public function insert($table, $params) {
		$listechamps = "";
		$listevaleurs = "";
		$donnees = array();
		$compt = 0;
		
        foreach($params as $champ => $valeur) {
			if ($listechamps != "") {
				$listechamps=$listechamps . ", ";
				$listevaleurs=$listevaleurs . ", ";
			}

			$listechamps = $listechamps . "`" . $champ . "`";
			$listevaleurs = $listevaleurs . ":valeur" . $compt."";
			$donnees['valeur' . $compt] = $params[$champ] === false ? null : $params[$champ];
			$compt++;
		}
		
        $requete = "INSERT INTO `" . $table . "` (" . $listechamps . ") VALUES (" . $listevaleurs . ")";
		$traitement = $this->prepare($requete);
		$num = 0;
		
        foreach($donnees as $champ => $valeur) {
			$traitement->bindValue(":" . $champ . "", $valeur);
		}
		
        $resultat = $traitement->execute();
		if ($resultat) {
			return $this->lastInsertId();
		} else {
			return false;
		}
	}

	public function update($table, $params, $cle, $nomcle = "cle") {
		$liste = "";
		$compt = 0;
		$donnees = array();
		
        foreach($params as $champ => $valeur) {
			$liste = ($liste ? $liste . ", " : '') . "`$champ` = :valeur" . $compt;
			$donnees['valeur' . $compt] = $params[$champ] === false ? null : $params[$champ];
			$compt++;
		}

        $requete = "UPDATE `$table` SET $liste WHERE `$nomcle` = " . $this->quote($cle);
		$traitement = $this->prepare($requete);
		$num = 0;
		
        foreach($donnees as $champ => $valeur) {
			$traitement->bindValue(":" . $champ . "", $valeur);
		}
		
        $resultat = $traitement->execute();
		if ($resultat) {
			return $resultat;
		} else {
			// erreur
            var_dump($traitement->errorInfo());
			return false;
		}
	}

	public function delete($table, $where = '1') {		
		return $this->exec("DELETE FROM `$table` WHERE $where");
	}
}