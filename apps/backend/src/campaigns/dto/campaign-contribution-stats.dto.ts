import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class CampaignContributionStats {
  @Field(() => Number, { description: 'Celkový počet příspěvků' })
  totalContributions: number;

  @Field(() => Number, { description: 'Celková výše příspěvků' })
  totalAmount: number;

  @Field(() => Number, { description: 'Průměrný příspěvek' })
  averageContribution: number;

  @Field(() => Number, { description: 'Počet unikátních přispěvatelů' })
  contributorsCount: number;
}
