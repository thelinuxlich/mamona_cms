define(['viewmodels/role/form'],
    function(Form){
        return {
            activate: function() {
                this.form = new Form();
            }
        };
    }
);