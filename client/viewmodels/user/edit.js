define(['viewmodels/user/form'],
    function(Form){
        return {
            form: null,
            activate: function(id) {
                this.form = new Form(id);
            }
        }
    }
);