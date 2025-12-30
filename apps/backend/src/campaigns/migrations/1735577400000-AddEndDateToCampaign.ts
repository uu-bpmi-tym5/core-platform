import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddEndDateToCampaign1735577400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'campaign',
      new TableColumn({
        name: 'endDate',
        type: 'timestamp',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('campaign', 'endDate');
  }
}

