import { Injectable } from '@nestjs/common';
import { CreateAuthAuditLogInput } from './dto/create-auth_audit_log.input';
import { UpdateAuthAuditLogInput } from './dto/update-auth_audit_log.input';

@Injectable()
export class AuthAuditLogsService {
  create(createAuthAuditLogInput: CreateAuthAuditLogInput) {
    void createAuthAuditLogInput;
    return 'This action adds a new authAuditLog';
  }

  findAll() {
    return `This action returns all authAuditLogs`;
  }

  findOne(id: number) {
    return `This action returns a #${id} authAuditLog`;
  }

  update(id: number, updateAuthAuditLogInput: UpdateAuthAuditLogInput) {
    void updateAuthAuditLogInput;
    return `This action updates a #${id} authAuditLog`;
  }

  remove(id: number) {
    return `This action removes a #${id} authAuditLog`;
  }
}
