<?php
class LoginController extends ApplicationController {

    public static function check_session() {
        if(isset($_SESSION["user"])) {
            $user = R::load("user",$_SESSION["user"]["id"]);
            if(in_array($_GET["resource"],self::$app->config("resources"))) {
                if($_GET["action"] == "index") {
                    $action = "read";
                } else if(in_array($_GET["action"],array("new","edit"))) {
                    $action = "write";
                } else if($_GET["action"] == "remove") {
                    $action = "remove";
                } else {
                    $authorized = true;
                }
                if(!isset($authorized)) {
                    $authorized = $user->can($action,$_GET["resource"]);
                }
            } else {
                $authorized = true;
            }
            $permissions = R::getAll('select resource,action_write,action_read,action_remove from permission where role_id = '.$user->role_id);
            self::render_json(array("status" => true,"username" => $_SESSION["user"]["name"],"authorized" => $authorized,"permissions" => $permissions));
        } else {
            self::render_json(array("status" => false));
        }
    }

    public static function create() {
        $user = R::findOne("user"," email = ? and password = ? and status = 1 ",array($_POST["email"],sha1($_POST["password"].self::$app->config("salt"))));
        if($user) {
            $_SESSION["user"] = array("id" => $user->id,"name" => $user->name);
            $user->last_login_at = date("Y-m-d h:i:s");
            R::store($user);
            $permissions = R::getAll("select resource,action_read,action_write,action_remove from permission where role_id = ".$user->role_id);
            $json = array('status' => true,'msg' => 'Bem-vindo!','username' => $user->name,'permissions' => $permissions);
        } else {
            $json = array('status' => false,'msg' => 'Usuário e/ou senha inválida!');
        }
        self::render_json($json);
    }

    public static function forgot_password() {
        $user = R::findOne("user"," email = ? ",array($_POST["email"]));
        $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $randomString = '';
        for ($i = 0; $i < 6; $i++) {
            $randomString .= $characters[rand(0, strlen($characters) - 1)];
        }
        $user->password = sha1($randomString.self::$app->config("salt"));
        R::store($user);
        $status = self::send_mail($_POST["email"],"[MAMONA CMS] Nova senha","Olá, sua nova senha é ".$randomString);
        self::render_json(array("status" => $status));
    }

    public static function delete() {
        unset($_SESSION["user"]);
    }
}