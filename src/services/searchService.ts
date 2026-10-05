import { User, Institution, Community, Opportunity, EventItem } from '../types.ts';
import { getAllUsers } from './authService.ts';
import { institutionService } from './institutionService.ts';
import { opportunityService } from './opportunityService.ts';
import { eventService } from './eventService.ts';

export interface GlobalSearchResults {
  exactUidMatch: User | Institution | null;
  people: User[];
  institutions: Institution[];
  communities: Community[];
  opportunities: Opportunity[];
  events: EventItem[];
  totalMatches: number;
}

export const searchService = {
  async searchGlobal(query: string): Promise<GlobalSearchResults> {
    if (!query || query.trim().length === 0) {
      return {
        exactUidMatch: null,
        people: [],
        institutions: [],
        communities: [],
        opportunities: [],
        events: [],
        totalMatches: 0
      };
    }

    const q = query.trim().toLowerCase();
    const isUidQuery = q.startsWith('an-') || q.includes('an-');

    const [allUsers, allInstitutions, allOpps, allEvents] = await Promise.all([
      getAllUsers(),
      institutionService.getInstitutions(),
      opportunityService.getOpportunities(),
      eventService.getEvents()
    ]);
    const allCommunities: Community[] = [];

    // Check exact UID match first
    let exactUidMatch: User | Institution | null = null;
    const userUidMatch = allUsers.find(u => u.uid.toLowerCase() === q);
    if (userUidMatch) {
      exactUidMatch = userUidMatch;
    } else {
      const instUidMatch = allInstitutions.find(i => i.uid.toLowerCase() === q);
      if (instUidMatch) {
        exactUidMatch = instUidMatch;
      }
    }

    // Filter People (Students, Alumni, Faculty) - sanitize to ensure private details are not exposed
    const people = allUsers.filter(u =>
      u.uid.toLowerCase().includes(q) ||
      u.name.toLowerCase().includes(q) ||
      (u.company && u.company.toLowerCase().includes(q)) ||
      (u.institutionName && u.institutionName.toLowerCase().includes(q)) ||
      (u.skills && u.skills.some(s => s.toLowerCase().includes(q)))
    );

    // Filter Institutions
    const institutions = allInstitutions.filter(i =>
      i.uid.toLowerCase().includes(q) ||
      i.name.toLowerCase().includes(q) ||
      i.city.toLowerCase().includes(q) ||
      i.affiliation.toLowerCase().includes(q)
    );

    // Filter Communities
    const communities = allCommunities.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.tags.some(t => t.toLowerCase().includes(q))
    );

    // Filter Opportunities
    const opportunities = allOpps.filter(o =>
      o.title.toLowerCase().includes(q) ||
      o.company.toLowerCase().includes(q) ||
      o.skills.some(s => s.toLowerCase().includes(q))
    );

    // Filter Events
    const events = allEvents.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.organizer.toLowerCase().includes(q)
    );

    const totalMatches =
      people.length + institutions.length + communities.length + opportunities.length + events.length;

    return {
      exactUidMatch,
      people,
      institutions,
      communities,
      opportunities,
      events,
      totalMatches
    };
  }
};
