using Microsoft.AspNetCore.Mvc.RazorPages;

namespace RazorApp.Pages;

// PageModel for the LTS Pricing Calculator page. Intentionally empty —
// every calculation, tab switch, save/export, etc. happens client-side in
// wwwroot/js/pricing-calculator.js. OnGet() exists only because Razor
// Pages requires a handler method; there is nothing to fetch or compute
// on the server for this page.
public class IndexModel : PageModel
{
    public void OnGet()
    {
    }
}
