using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using Umbraco.Core.Models.PublishedContent;
using Umbraco.Web;
using Umbraco.Web.Models;
using Umbraco.Web.Mvc;
using X.Web.Sitemap;

namespace Tranquility.Controllers
{
    public class SitemapController : RenderMvcController
    {
        //[OutputCache(Duration = 3600)]
        public ActionResult Sitemap(ContentModel model, string xml)
        {
            if (!string.IsNullOrWhiteSpace(xml))
            {
                var sitemap = new Sitemap();

                var root = this.Umbraco.ContentAtRoot().FirstOrDefault();
                var contentItems = new List<IPublishedContent>
                {
                    root
                };
                foreach (var child in root.Descendants())
                {
                    contentItems.Add(child);
                    if (child.Descendants().Any())
                    {
                    }
                    contentItems = contentItems.Concat(child.Descendants()).ToList();
                }

                foreach (var content in contentItems.Where(x => x.IsVisible()))
                {
                    sitemap.Add(new Url
                    {
                        ChangeFrequency = ChangeFrequency.Daily,
                        Location = content.Url(),
                        Priority = 0.5,
                        TimeStamp = content.CreateDate
                    });
                }
                return Content(sitemap.ToXml(), "text/xml");
            }
            else
            {
                return CurrentTemplate(model);
            }
        }
    }
}