define(['viewmodels/user/form'],
    function(Form){
        return {
            activate: function() {
                this.form = new Form();
            }
        };
    }
);