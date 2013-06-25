<?php
class HomeController extends ApplicationController {
	public static function index() {
        self::render();
	}

    public static function seed() {
        R::nuke();
        $mussum_ipsum = "Mussum ipsum cacilds, vidis litro abertis. Consetis adipiscings elitis. Pra lá , depois divoltis porris, paradis. Paisis, filhis, espiritis santis. Mé faiz elementum girarzis, nisi eros vermeio, in elementis mé pra quem é amistosis quis leo. Manduma pindureta quium dia nois paga. Sapien in monti palavris qui num significa nadis i pareci latim. Interessantiss quisso pudia ce receita de bolis, mais bolis eu num gostis.
Suco de cevadiss, é um leite divinis, qui tem lupuliz, matis, aguis e fermentis. Interagi no mé, cursus quis, vehicula ac nisi. Aenean vel dui dui. Nullam leo erat, aliquet quis tempus a, posuere ut mi. Ut scelerisque neque et turpis posuere pulvinar pellentesque nibh ullamcorper. Pharetra in mattis molestie, volutpat elementum justo. Aenean ut ante turpis. Pellentesque laoreet mé vel lectus scelerisque interdum cursus velit auctor. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam ac mauris lectus, non scelerisque augue. Aenean justo massa.";
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
        $user->last_login_at = R::$f->now();
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
        R::exec("ALTER TABLE user ALTER status SET DEFAULT 0");
        die("OK");
    }
}