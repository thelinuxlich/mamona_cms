define(['jquery_form','viewmodels/role/role','durandal/app','viewmodels/shell','bootstrap_validation'],
function(jquery_form,Role,app,shell,bootstrap_validation){
    var Form = function(id) {
        this.role = new Role();
        if(!!id) {
            this.role.id = id;
        }
        this.submit = function(element) {
            var that = this;
            if($(element).jqBootstrapValidation("hasErrors")) {
                return false;
            } else {
                var submit = $(element).find("button[type=submit]");
                submit.button("loading");
                $(element).ajaxSubmit({url: "role/"+(that.role.id == "" ? "create" : "update/"+that.role.id),dataType: 'json',
                    success: function(r) {
                        shell.router.navigate('role',true);
                        app.trigger("flash",{type: "success", msg: "Nível "+(that.role.id == "" ? "gravado" : "atualizado")+" com sucesso!"});
                        submit.button("reset");
                    },
                    error: function(r) {
                        app.showMessage("Ocorreu um erro ao tentar "+(that.role.id == "" ? "gravar" : "atualizar")+" o nível. Tente novamente mais tarde");
                        submit.button("reset");
                    }
                });
            }
        };
    };

    Form.prototype.activate = function() {
        var that = this;
        if(that.role.id !== "") {
            return $.get("role/"+that.role.id).then(function(r){
                that.role.name(r.name).description(r.description);
            });
        }
    };

    Form.prototype.viewAttached = function() {
        $("input,select,textarea").not("[type=submit]").jqBootstrapValidation();
    };

    return Form;
});