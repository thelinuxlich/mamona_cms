define(['durandal/app','viewmodels/shell','durandal/system','knockout','./customModal'],function (app,shell,system,ko,CustomModal) {
    return {
        email: ko.observable(""),
        password: ko.observable(""),
        forgotPassword: function() {
            app.showModal(new CustomModal()).then(function(response) {
                $.post("forgot_password",{email: response}).then(function(r){
                    if(r.status) {
                        app.showMessage("Um e-mail foi enviado, verifique sua caixa de entrada.");
                    } else {
                        app.showMessage("Ocorreu um erro ao tentar enviar um e-mail, cheque o endereço e tente novamente.");
                    }
                });
            });
        },
        submit: function() {
            var that = this;
            $.post("login",{email: that.email(),password: that.password()}).then(function(r){
                if(r.status) {
                    app.trigger("flash",{type: "success", msg: r.msg});
                    app.trigger("loadPermissions",r.permissions);
                    app.trigger("username",r.username);
                    shell.router.navigate("",true);
                } else {
                    app.trigger("flashNow",{type: "error", msg: r.msg});
                }
            });
        }
    };
});