/* Email notifications for every quote request and every review.

   Each one is sent to quovex.agency@gmail.com as a designed email (the
   designs are in tools/email-templates/), through EmailJS: a service
   that sends emails straight from the page, so the site needs no server
   of its own and stays a plain upload on Netlify.

   Fill these in from your EmailJS dashboard (see tools/EMAIL-SETUP.md).
   Until they're filled in, quotes and reviews still reach you as plain
   emails through the older Web3Forms setup, so nothing is missed. */
var QUOVEX_EMAIL = {
  publicKey: 'Kb9dFoaw81e-amiCI', // Account → General → Public key
  serviceId: 'service_8kdbnzf', // Email Services → your Gmail service's ID
  quoteTemplate: 'template_odrl7ds', // Email Templates → "New quote" template's ID
  reviewTemplate: 'template_dan3a6n' // Email Templates → "New review" template's ID
};

(function(){
  var cfg = QUOVEX_EMAIL;

  function stamp(){
    try {
      return new Date().toLocaleString('en-GB', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
      });
    } catch(e){ return new Date().toString(); }
  }

  /* kind: 'quote' or 'review'. Resolves when sent, rejects on failure. */
  window.quovexNotify = function(kind, params){
    var template = kind === 'review' ? cfg.reviewTemplate : cfg.quoteTemplate;
    if(!cfg.publicKey || !cfg.serviceId || !template){
      return Promise.reject(new Error('not-configured'));
    }
    params = params || {};
    params.submitted_at = stamp();
    params.page = location.pathname.split('/').pop() || 'index.html';
    return fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        service_id: cfg.serviceId,
        template_id: template,
        user_id: cfg.publicKey,
        template_params: params
      })
    }).then(function(res){
      if(!res.ok) return res.text().then(function(t){ throw new Error('EmailJS ' + res.status + ': ' + t); });
    });
  };
  window.quovexNotify.isReady = function(){
    return !!(cfg.publicKey && cfg.serviceId && cfg.quoteTemplate && cfg.reviewTemplate);
  };
})();
