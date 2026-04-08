import { Injectable } from '@nestjs/common';
import { CreateAuthaAuditLogInput } from './dto/create-auth_audit_log.input';
import { UpdateAuthaAuditLogInput } from './dto/update-auth_audit_log.input';

@Injectable()
export class AuthaAuditLogsService {
  create(createAuthaAuditLogInput: CreateAuthaAuditLogInput) {
    return 'This action adds a new authaAuditLog';
  }

  findAll() {
    return `This action returns all authaAuditLogs`;
  }

  findOne(id: number) {
    return `This action returns a #${id} authaAuditLog`;
  }

  update(id: number, updateAuthaAuditLogInput: UpdateAuthaAuditLogInput) {
    return `This action updates a #${id} authaAuditLog`;
  }

  remove(id: number) {
    return `This action removes a #${id} authaAuditLog`;
  }
}
