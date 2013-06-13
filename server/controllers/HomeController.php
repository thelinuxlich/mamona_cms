<?php
class HomeController extends ApplicationController {
	public static function index() {
        self::render();
	}

    public static function seed() {
        R::nuke();
        $roles = array("admin" => "Administrador do Sistema","normal" => "Usuário Normal","guest" => "Usuário sem privilégios");
        foreach($roles as $k => $v) {
            $$k = R::dispense("role");
            $$k->name = $k;
            $$k->description = $v;
            R::store($$k);
        }
        $user = R::dispense('user');
        $user->name = "Administrador";
        $user->password = sha1("123456".self::$app->config("salt"));
        $user->email = "admin@luego.com.br";
        $user->avatar = "aaaaaaa";
        $user->status = 1;
        $user->last_login_at = date("Y-m-d h:i:s");
        $user->role = $admin;
        R::store($user);
        $user->avatar = "";
        R::store($user);
        foreach(self::$app->config("resources") as $resource) {
            $p = R::dispense("permission");
            $p->resource = $resource;
            $p->action_read = true;
            $p->action_write = true;
            $p->action_remove = true;
            $p->role = $admin;
            R::store($p);
        }
        $p = R::dispense("permission");
        $p->resource = "user";
        $p->action_read = true;
        $p->action_write = true;
        $p->action_remove = true;
        $p->role = $normal;
        R::store($p);
        R::exec("alter table user add unique (email)");
        R::exec("alter table role add unique (name)");
        R::exec("alter table permission add unique (resource,role_id)");
        R::exec("ALTER TABLE permission ALTER COLUMN action_read SET DEFAULT 0");
        R::exec("ALTER TABLE permission ALTER COLUMN action_write SET DEFAULT 0");
        R::exec("ALTER TABLE permission ALTER COLUMN action_remove SET DEFAULT 0");
        R::exec("ALTER TABLE user ALTER COLUMN status SET DEFAULT 0");
        die("OK");
    }
}