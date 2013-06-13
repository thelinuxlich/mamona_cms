<?php
class PermissionController extends ApplicationController {

    public static function index() {
        $permissions = R::getAll('select p.*,(select r.name from role r where r.id = p.role_id) as role_name from permission p order by id');
        self::render_json($permissions);
    }

    public static function show($id) {
        $permission = R::getRow("select * from permission where id = ?",array($id));
        self::render_json($permission);
    }

    public static function create() {
        self::save(R::dispense("permission"));
    }

    public static function update($id) {
        self::save(R::load("permission",$id));
    }

    private static function save($obj) {
        try {
            $obj->import($_POST,"resource,action_read,action_write,action_remove,role_id");
            R::store($obj);
        } catch(Exception $e) {
            self::render_json(array("status" => false));
        }
        self::render_json(array("status" => true));
    }

    public static function delete($id) {
        try {
            R::exec("delete from permission where id = ?",array($id));
        } catch(Exception $e) {
            self::render_json(array("status" => false,"msg" => htmlentities("Ocorreu um erro ao tentar excluir a permissão.")));
        }
        self::render_json(array("status" => true));
    }
}
