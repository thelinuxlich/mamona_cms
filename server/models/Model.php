<?php
class Model extends RedBean_SimpleModel{

	public static $app;

	public function set_attributes($dados) {
		foreach ($dados as $key => $value) {
			if(property_exists($this,$key)) {
		    	$this->$key = $value;
		    }
		}
	}

	public function to_array() {
	    $arr = (array)$this;
	    foreach($arr as $k => $v) {
	    	$newKey = str_replace("\0", "", str_replace(get_class($this),"",$k));
	    	$arr[$newKey] = $v;
	    	unset($arr[$k]);
	    }
	    return $arr;
	}

	public function update() {
		if($this->id == "") {
			$this->created_at = date("Y-m-d h:i:s");
		}
        $this->updated_at = date("Y-m-d h:i:s");
    }
}
?>