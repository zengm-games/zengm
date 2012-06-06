crossroads.addRoute(/^\/([0-9]+)/, function(lid){
  console.log(lid);
});
crossroads.addRoute('/', views.dashboard);

$(document).ready(function() {
    crossroads.parse(window.location.pathname);
});
