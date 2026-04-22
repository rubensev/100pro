import { IsIn, IsString } from 'class-validator';

export class UpdatePlanDto {
  @IsString()
  @IsIn(['free', 'pro', 'master'])
  plan: string;
}
