<?php
class PermissionModel extends Model {

    public function resource_name() {
        $resources = self::$app->config("resources");
        return(array_search($this->resource,$resources));
    }
}