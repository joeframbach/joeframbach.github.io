var disqus_shortname = 'joeframbach';
$(function() {
  $('.load-comments').click(function() {
    var loader = this;
    $('#disqus_thread').remove();
    $(loader).after($('<div id="disqus_thread"></div>'));
    DISQUS.reset({
      reload: true,
      config: function () {
        this.page.identifier = $(loader).data('shortname');
        this.page.url = "http://example.com/#!"+$(loader).data('shortname');
      }
    });
    $('.load-comments').not($(loader)).show();
    $(loader).hide();
  });
  $('.load-more').click(function() {
    $(this).closest('.post').css({'max-height':'auto'});
  });
});

  
function cs(username) {
  var success = function(html) {
    html = html.replace(/ src=/gm,' data-src=');
    $html = $(html);
    console.log($html.find('h1.profile').html());
    console.log($html.find('table.profile_header').html());
    console.log($html.find('div#ref_sum').html());
  };
  $.getJSON("http://query.yahooapis.com/v1/public/yql?"+
            "q=select%20*%20from%20html%20where%20url%3D%22"+
            encodeURIComponent('http://www.couchsurfing.org/users/'+username)+
            "%22&format=xml'&callback=?",
    function(data){
        if(data.results[0]){
            success(data.results[0]);
        }
    }
  );
}
