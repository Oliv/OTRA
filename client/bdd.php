<?php

class bdd extends PDO
	{
	public $host;
	public $dbname;
	public $user;
	
	public function __construct($host,$dbname,$user,$mdp)
		{
		$this -> host = $host;
		$this -> dbname = $dbname;
		$this -> user = $user;
		try
			{
			parent::__construct('mysql:host='.$host.';dbname='.$dbname, $user, $mdp);
			$this->query('SET NAMES utf8');
			}
		 
		catch(Exception $e)
			{
			print_r($e);
			return false;
			}
		}
	
	public function read($requete,$key = false, $don = false)
		{
		$resultats=$this->query($requete);
		$retour=array();
		if ($resultats)
			{
			$resultats->setFetchMode(PDO::FETCH_ASSOC); 
				while( $resultat = $resultats->fetch() ) 
				{
				if ($key == false)
					{
					if ($don == false)
						{
						array_push($retour,$resultat);
						}
					else
						{
						array_push($retour,$resultat[$don]);
						}
					}
				elseif ($don == false)
					{
					$retour[$resultat[$key]] = $resultat;
					}
				else
					{
					$retour[$resultat[$key]] = $resultat[$don];
					}
				}
			return $retour;
			}
		else
			{
			echo $requete;
			// erreur
			return $retour;
			}
		}

	function write($requete)
		{
		$resultat=$this->exec($requete);
		$BDD_error=$this->errorInfo();
		if ($BDD_error[0]=="00000")
			{
			return $resultat;
			}
		else
			{
			// erreur
			return false;
			}
		}

	function insert($db,$params)
		{
		$listechamps="";
		$listevaleurs="";
		$donnees=array();
		$compt=0;
		foreach($params as $champ => $valeur)
			{
			if ($listechamps!="")
				{
				$listechamps=$listechamps.", ";
				$listevaleurs=$listevaleurs.", ";
				}
			$listechamps=$listechamps."`".$champ."`";
			$listevaleurs = $listevaleurs.":valeur".$compt."";
			$donnees['valeur'.$compt]=$params[$champ] === false ? null : $params[$champ];
			$compt++;
			}
		$requete = "INSERT INTO `".$db."` (".$listechamps.") VALUES (".$listevaleurs.")";
		$traitement = $this->prepare($requete);
		$num=0;
		foreach($donnees as $champ => $valeur)
			{
			$traitement->bindValue(":".$champ."",$valeur);
			}
		$resultat=$traitement->execute();
		if ($resultat)
			{
			return $this->lastInsertId();
			}
		else
			{
			print_r($this->errorInfo());
			return false;
			}
		}

	function update($db,$params,$cle,$nomcle="cle")
		{
		$liste="";
		$compt=0;
		$donnees=array();
		foreach($params as $champ => $valeur)
			{
			if ($liste!="")
				{
				$liste=$liste.", ";
				}
			$liste=$liste."`".$champ."` = :valeur".$compt;
			$donnees['valeur'.$compt] = $params[$champ] === false ? null : $params[$champ];
			$compt++;
			}
		$requete = "UPDATE `".$db."` SET ".$liste." Where `".$nomcle."` = ".$this->quote($cle)."";
		$traitement = $this->prepare($requete);
		$num=0;
		foreach($donnees as $champ => $valeur)
			{
			$traitement->bindValue(":".$champ."",$valeur);
			}
		$resultat=$traitement->execute();
		if ($resultat)
			{
			return $resultat;
			}
		else
			{
			// erreur
			erreur(print_r($traitement->errorInfo(),true));
			return false;
			}
		}
	}

?>