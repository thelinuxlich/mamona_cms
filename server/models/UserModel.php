<?php
class UserModel extends Model {
    public function can_read($resource) {
        return $this->can("read",$resource);
    }

    public function can_write($resource) {
        return $this->can("write",$resource);
    }

    public function can_remove($resource) {
        return $this->can("remove",$resource);
    }

    public function can($action,$resource) {
        $p = $this->role->withCondition(" action_".$action." = 1 and resource = ?",array($resource))->ownPermission;
        return(count($p) > 0);
    }
}