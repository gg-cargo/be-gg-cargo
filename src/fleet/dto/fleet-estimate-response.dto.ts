import { FleetEstimateResult } from '../fleet-estimate.calculator';

export class FleetEstimateResponseDto {
  success: boolean;
  message: string;
  data: FleetEstimateResult;
}
