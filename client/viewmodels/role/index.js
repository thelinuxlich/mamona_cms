define(['durandal/app','viewmodels/table/index'],
function (app,Table) {
    this.table = "";
    return {
        table: this.table,
        attached: function() {
            Table.initializeTable("role");
        },
        activate: function() {
            var that = this;
            return $.get("role").then(function(r){
                var table = new Table(r,{'#': 'id','Nome': 'name','Descrição': 'description'},["Excluir"]);
                that.table = table.html;
            });
        }
    };
});