<?php
function add_routes($app) {

    $can = function ($action,$resource) use($app) {
        return function () use ($app,$action,$resource) {
            if(isset($_SESSION["user"])) {
                $user = R::load("user",$_SESSION["user"]["id"]);
            }
            return $user->can($action,$resource);
        };
    };

    $app->get('/seed',function() { HomeController::seed(); });

    foreach($app->config('resources') as $v) {
        $controller = ucfirst($v)."Controller";
        $app->get('/'.$v,$can("read",$v),function() use($controller){ $controller::index(); });
        $app->get('/'.$v.'/:id',$can("read",$v),function($id) use($controller) { $controller::show($id); })->conditions(array('id' => '[0-9]+'));;
        $app->post('/'.$v.'/create',$can("write",$v),function() use($controller) { $controller::create(); });
        $app->post('/'.$v.'/update/:id',$can("write",$v),function($id) use($controller) { $controller::update($id); });
        $app->post('/'.$v.'/delete/:id',$can("remove",$v),function($id) use($controller) { $controller::delete($id); });
        $app->post('/'.$v.'/update_status/:id',$can("write",$v),function($id) use($controller) { $controller::update_status($id); });
    }

    $app->get('/',function() use($app) { $app->render("template.php"); });
    $app->get('/check_session',function() { LoginController::check_session(); });
    $app->post('/logoff',function() { LoginController::delete(); });
    $app->post('/login',function() { LoginController::create(); });
    $app->post('/forgot_password',function() { LoginController::forgot_password(); });
}