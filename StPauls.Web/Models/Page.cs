using System;

namespace StPauls.Models
{
    public partial class Page
    {
        public string Title => string.IsNullOrWhiteSpace(this.TitleOverrides) ? this.Name : this.TitleOverrides;

        public string FormattedDate
        {
            get
            {
                if (this.CreateDate.Date == DateTime.Now.Date)
                {
                    return "Today at " + this.CreateDate.ToString("HH:MM");
                }
                else if (this.CreateDate.Date > DateTime.Now.AddDays(-6))
                {
                    return this.CreateDate.DayOfWeek.ToString();
                }

                return this.CreateDate.ToString("dd-MMM-yy");
            }
        }
    }
}