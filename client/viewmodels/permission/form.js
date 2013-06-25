define(['jasny_bootstrap','plugins/dialog','jquery_form','viewmodels/permission/permission','durandal/app','viewmodels/shell','bootstrap_validation'],
function(j,dialog,jquery_form,Permission,app,shell,bootstrap_validation){
    var Form = function(id) {
        this.permission = new Permission();
        if(!!id) {
            this.permission.id = id;
        }
        this.roles = [];
        this.resources = [
            {id: "user",name: "Usuários"},
            {id: "role",name: "Níveis"},
            {id: "permission",name: "Permissões"},
            {id: "event",name: "Eventos"},
            {id: "member",name: "Membros"}
        ];
        this.submit = function(element) {
            var that = this;
            if($(element).jqBootstrapValidation("hasErrors")) {
                return false;
            } else {
                var submit = $(element).find("button[type=submit]");
                submit.button("loading");
                $(element).ajaxSubmit({url: "permission/"+(that.permission.id == "" ? "create" : "update/"+that.permission.id),dataType: 'json',
                    success: function(r) {
                        shell.router.navigate('permission',true);
                        app.trigger("flash",{type: "success", msg: "Permissão "+(that.permission.id == "" ? "gravada" : "atualizada")+" com sucesso!"});
                        submit.button("reset");
                    },
                    error: function(r) {
                        dialog.showMessage("Ocorreu um erro ao tentar "+(that.permission.id == "" ? "gravar" : "atualizar")+" a permissão. Tente novamente mais tarde");
                        submit.button("reset");
                    }
                });
            }
        };
    };

    Form.prototype.activate = function() {
        var that = this;
        return $.getJSON("role").then(function(r){
            that.roles = r;
            if(that.permission.id !== "") {
                return $.get("permission/"+that.permission.id,function(p){
                    that.permission.resource(p.resource)
                    .action_write(p.action_write)
                    .action_remove(p.action_remove)
                    .action_read(p.action_read)
                    .role_id(p.role_id);
                });
            }
        });
    };

    Form.prototype.compositionComplete = function() {
        $("input,select,textarea").not("[type=submit]").jqBootstrapValidation();
    };

    return Form;
});