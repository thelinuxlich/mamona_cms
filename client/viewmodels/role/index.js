define(['durandal/app','viewmodels/table/index'],
function (app,Table) {
    this.table = "";
    return {
        table: this.table,
        viewAttached: function() {
            Table.initializeTable("roles");
        },
        activate: function() {
            var that = this;
            return $.get("role").then(function(r){
                var table = new Table(r,{'#': 'id','Nome': 'name','Descrição': 'description'});
                that.table = table.html;
            });
        }
    };
});