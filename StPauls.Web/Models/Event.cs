using System;

namespace StPauls.Models
{
    public partial class Event
    {
        /// <summary>
        /// Time to go until start date.
        /// </summary>
        public TimeSpan TimeToGo => this.StartDate - DateTime.Now;

        public EventStatus Status
        {
            get
            {
                if (this.StartDate < DateTime.Now)
                {
                    //We have an end date to check if event is active. //If No end date, has it been a day since the event started?
                    if ((this.EndDate != default(DateTime) && this.EndDate < DateTime.Now) || (!(this.EndDate != default(DateTime)) && this.StartDate.AddHours(24) < DateTime.Now))
                    {
                        return EventStatus.Expired;
                    }
                    //Must still be active then.
                    else
                    {
                        return EventStatus.Active;
                    }
                }
                else if (this.StartDate < DateTime.Now.AddDays(7))
                {
                    return EventStatus.Soon;
                }

                return EventStatus.Future;
            }
        }

        public string EventStatusBootstrapColourClass
        {
            get
            {
                switch (this.Status)
                {
                    case EventStatus.Active:
                        return "success";
                    case EventStatus.Expired:
                        return "danger";
                    case EventStatus.Soon:
                        return "warning";
                    case EventStatus.Future:
                    default:
                        return "default";
                }

            }
        }
    }


    public enum EventStatus
    {
        Expired = 0,
        Active = 1,
        Soon = 2,
        Future = 3
    }
}