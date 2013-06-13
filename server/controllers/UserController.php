<?php
class UserController extends ApplicationController {

    public static function index() {
        $users = R::getAll("select u.id,u.name,u.email,u.avatar,date_format(u.last_login_at,'%d/%m/%Y %H:%i:%s') last_login_at,date_format(u.created_at,'%d/%m/%Y %H:%i:%s') created_at,u.status,(select r.name from role r where r.id = u.role_id) as role_name from user u");
        self::render_json($users);
    }

    public static function show($id) {
        $user = R::getRow("select * from user where id = ?",array($id));
        self::render_json($user);
    }

    public static function create() {
        try {
            $user = R::dispense("user");
            $user->import($_POST,"name,email,status,role_id,password");
            $user->password = sha1($user->password.self::$app->config('salt'));
            R::store($user);
            self::upload($user);
            R::store($user);
        } catch(Exception $e) {
            self::render_json(array("status" => false));
        }
        self::render_json(array("status" => true));
    }

    private static function upload($user) {
        $upload_dir = self::$app->config('upload_dir').$user->id."/";
        try {
            if(is_dir($upload_dir) == false) {
                mkdir($upload_dir);
            }
            if($_FILES['avatar']["tmp_name"] != "" && move_uploaded_file($_FILES['avatar']["tmp_name"],$upload_dir.$_FILES['avatar']["name"]))
            {
                $user->avatar = $upload_dir.$_FILES['avatar']["name"];
            }
        } catch(Exception $e) {
            self::log("ERRO: ".$e->getMessage());
        }
    }

    public static function update($id) {
        try {
            $user = R::load("user",$id);
            $user->import($_POST,"name,email,status,role_id");
            self::upload($user);
            R::store($user);
        } catch(Exception $e) {
            self::render_json(array("status" => false));
        }
        self::render_json(array("status" => true));
    }

    public static function update_status($id) {
        try {
            $user = R::exec("update user set status = !status where id = ?",array($id));
            self::render_json(array("status" => true));
        } catch(Exception $e) {
            self::render_json(array("status" => false,"msg" => htmlentities("Não foi possível mudar o status.")));
        }
    }

    public static function delete($id) {
        try {
            R::exec("delete from user where id = ?",array($id));
        } catch(Exception $e) {
            self::render_json(array("status" => false,"msg" => "Não foi possível remover o usuário."));
        }
        self::render_json(array("status" => true));
    }
}
