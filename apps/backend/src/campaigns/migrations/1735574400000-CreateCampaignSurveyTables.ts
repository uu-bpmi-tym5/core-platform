import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateCampaignSurveyTables1735574400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create campaign_survey table
    await queryRunner.createTable(
      new Table({
        name: 'campaign_survey',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'campaignId',
            type: 'uuid',
          },
          {
            name: 'creatorId',
            type: 'uuid',
          },
          {
            name: 'title',
            type: 'varchar',
          },
          {
            name: 'questions',
            type: 'text',
            isArray: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'closedAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Add foreign keys for campaign_survey
    await queryRunner.createForeignKey(
      'campaign_survey',
      new TableForeignKey({
        columnNames: ['campaignId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'campaign',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'campaign_survey',
      new TableForeignKey({
        columnNames: ['creatorId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
      }),
    );

    // Create campaign_survey_response table
    await queryRunner.createTable(
      new Table({
        name: 'campaign_survey_response',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'surveyId',
            type: 'uuid',
          },
          {
            name: 'respondentId',
            type: 'uuid',
          },
          {
            name: 'answers',
            type: 'text',
            isArray: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign keys for campaign_survey_response
    await queryRunner.createForeignKey(
      'campaign_survey_response',
      new TableForeignKey({
        columnNames: ['surveyId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'campaign_survey',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'campaign_survey_response',
      new TableForeignKey({
        columnNames: ['respondentId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('campaign_survey_response');
    await queryRunner.dropTable('campaign_survey');
  }
}

