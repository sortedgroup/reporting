var coll = document.getElementsByClassName("collapsible");
var i;

for (i = 0; i < coll.length; i++) {
  coll[i].addEventListener("click", function() {
    this.classList.toggle("activate");
    var collapsecontent = this.nextElementSibling;
    if (collapsecontent.style.display === "block") {
      collapsecontent.style.display = "none";
    } else {
      collapsecontent.style.display = "block";
    }
  });
}