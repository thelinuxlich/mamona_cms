define(['plugins/router','durandal/app','durandal/system','knockout','bootstrap'],
function (router,app,system,ko,bootstrap){
    return {
        router: router,
        title: app.title,
        username: ko.observable(),
        flash: ko.observable({msg: null,type: null}),
        logged: ko.observable(false),
        permissions: ko.observableArray([]),
        can: function(action_type,resource) {
            var p = ko.utils.arrayFirst(this.permissions(),function(item){
                return item.resource == resource;
            });
            if(!!p) {
                return(p["action_"+action_type] == 1);
            } else {
                return false;
            }
        },
        closeFlash: function() {
            $("#flash").hide();
        },
        logoff: function() {
            var that = this;
            $.post("logoff").then(function(r) {
                that.logged(false);
                app.trigger('flash',{type: "success",msg: "Você desconectou do sistema."});
                that.router.navigate("#access",true);
            });
        },
        activate: function () {
            var that = this;
            app.on('flash').then(function(obj){
                that.flash().msg = obj.msg;
                that.flash().type = obj.type;
            });
            app.on('flashNow').then(function(obj){
                that.flash({msg: obj.msg,type: obj.type});
            });
            app.on("username").then(function(name){
                that.username(name);
            });
            app.on("loadPermissions").then(function(obj){
                that.permissions(obj);
            });
            router.on("router:navigation:complete",function() {
                that.flash.valueHasMutated();
                that.flash().msg = null;
                that.flash().type = null;
            });
            router.guardRoute = function(routeInfo, params, instance) {
                if(routeInfo["__moduleId__"] !== "viewmodels/access/index") {
                    var routeArray = routeInfo["__moduleId__"].split("/");
                    return $.get("check_session",{resource: routeArray[1],action: routeArray[2]}).then(function(r){
                        if(r.status) {
                            that.logged(true);
                            that.username(r.username);
                            that.permissions(r.permissions);
                            return r.authorized;
                        } else {
                            return "#access";
                        }
                    });
                } else {
                    return true;
                }
            };
            router.map([
                { route: '', moduleId: 'viewmodels/hello/index', title: 'Início' },
                { route: 'user', moduleId: 'viewmodels/user/index', title: 'Usuários', nav: true },
                { route: 'user/new', moduleId: 'viewmodels/user/new', title: 'Novo Usuário'},
                { route: 'user/:id/edit', moduleId: 'viewmodels/user/edit', title: 'Editar Usuário'},
                { route: 'role', moduleId: 'viewmodels/role/index', title: 'Níveis', nav: true },
                { route: 'role/new', moduleId: 'viewmodels/role/new', title: 'Novo Nível'},
                { route: 'role/:id/edit', moduleId: 'viewmodels/role/edit', title: 'Editar Nível'},
                { route: 'permission', moduleId: 'viewmodels/permission/index', title: 'Permissões', nav: true },
                { route: 'permission/new', moduleId: 'viewmodels/permission/new', title: 'Nova Permissão'},
                { route: 'permission/:id/edit', moduleId: 'viewmodels/permission/edit', title: 'Editar Permissão'},
                { route: 'access', moduleId: 'viewmodels/access/index', title: 'Acesso ao Sistema'},
                { route: '404', moduleId: 'viewmodels/404/index', title: 'Página não encontrada'}
            ]).buildNavigationModel();
            router.mapUnknownRoutes("viewmodels/404/index");
            return router.activate();
        }
    };
});
