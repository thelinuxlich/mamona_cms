<?php
class RoleController extends ApplicationController {

    public static function index() {
        $roles = R::getAll('select * from role order by name');
        self::render_json($roles);
    }

    public static function show($id) {
        $role = R::getRow("select * from role where id = ?",array($id));
        self::render_json($role);
    }

    public static function create() {
        self::save(R::dispense("role"));
    }

    public static function update($id) {
        self::save(R::load("role",$id));
    }

    private static function save($obj) {
        try {
            $obj->import($_POST,"name,description");
            R::store($obj);
        } catch(Exception $e) {
            self::render_json(array("status" => false));
        }
        self::render_json(array("status" => true));
    }

    public static function delete($id) {
        try {
            R::exec("delete from role where id = ?",array($id));
        } catch(Exception $e) {
            self::render_json(array("status" => false,"msg" => "Ocorreu um erro ao tentar excluir o registro!"));
        }
        self::render_json(array("status" => true));
    }
}
