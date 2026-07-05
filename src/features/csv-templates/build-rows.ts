import type { CsvTemplateRowSource } from '@/lib/csv-template';
import type { ClientWithRelations } from '@/server/repositories/client-repository';

export interface CsvGenerationRow {
  clientId: string;
  foreignNationalId: string;
  companyName: string;
  foreignNationalName: string;
  source: CsvTemplateRowSource;
}

/** 検索結果(Client[])を、外国人1名につき1行のCSV生成用データへ平坦化する。 */
export function buildCsvGenerationRows(clients: ClientWithRelations[]): CsvGenerationRow[] {
  return clients.flatMap((client) =>
    client.foreignNationals.map((foreignNational) => {
      const latestStatus = foreignNational.residenceStatuses[0]; // expiresAt降順で取得済み
      return {
        clientId: client.id,
        foreignNationalId: foreignNational.id,
        companyName: client.companyName,
        foreignNationalName: foreignNational.fullName,
        source: {
          companyName: client.companyName,
          fullName: foreignNational.fullName,
          fullNameKana: foreignNational.fullNameKana,
          nationality: foreignNational.nationality,
          birthDate: foreignNational.birthDate,
          passportNumber: foreignNational.passportNumber,
          residenceCardNumber: foreignNational.residenceCardNumber,
          statusType: latestStatus?.statusType ?? null,
          permitNumber: latestStatus?.permitNumber ?? null,
          expiresAt: latestStatus?.expiresAt ?? null,
        },
      };
    }),
  );
}
