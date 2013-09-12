define(['viewmodels/permission/form'],
    function(Form){
        return {
            activate: function() {
                this.form = new Form();
            }
        }
    }
);