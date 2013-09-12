define(['plugins/dialog','viewmodels/user/user','durandal/app','viewmodels/shell','durandal/system'],
function(dialog,User,app,shell,system){
    var Form = function(id) {
        this.user = new User();
        if(!!id) {
            this.user.id = id;
        }
        this.roles = [];
        this.submit = function(element) {
            var that = this;
            if($(element).jqBootstrapValidation("hasErrors")) {
                return false;
            } else {
                var submit = $(element).find("button[type=submit]");
                submit.button("loading");
                if(!!that.user.id && !!that.user.avatar()) {
                    that.user.avatar($("#avatar").val());
                }
                $(element).ajaxSubmit({url: "user/"+(that.user.id == "" ? "create" : "update/"+that.user.id),data: ko.toJS(that.user),type: "POST",dataType: 'json',iframe: true,
                    success: function(r) {
                        shell.router.navigate('user');
                        app.trigger("flash",{type: "success", msg: "Usuário "+(that.user.id == "" ? "gravado" : "atualizado")+" com sucesso!"});
                        submit.button("reset");
                    },
                    error: function(r) {
                        dialog.showMessage("Ocorreu um erro ao tentar "+(that.user.id == "" ? "gravar" : "atualizar")+" o usuário. Tente novamente mais tarde");
                        submit.button("reset");
                    }
                });
            }
        };
    };

    Form.prototype.activate = function() {
        var that = this;
        return $.get("role").then(function(r){
            that.roles = r;
            if(that.user.id !== "") {
                return $.get("user/"+that.user.id,function(u){
                    that.user.name(u.name)
                    .avatar(u.avatar)
                    .role_id(u.role_id)
                    .email(u.email)
                    .status(u.status);
                });
            }
        });
    };

    Form.prototype.compositionComplete = function() {
        $("input,select,textarea").not("[type=submit]").jqBootstrapValidation();
    };

    return Form;
});