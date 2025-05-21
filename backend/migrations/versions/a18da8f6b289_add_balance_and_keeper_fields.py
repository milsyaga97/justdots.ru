"""add_balance_and_keeper_fields

Revision ID: a18da8f6b289
Revises: 4b05c924a4af
Create Date: 2025-05-21 19:08:01.203587

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a18da8f6b289'
down_revision: Union[str, None] = '4b05c924a4af'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Добавляем поле balance в таблицу users
    op.add_column('users', sa.Column('balance', sa.Float(), nullable=False, server_default='0.0'))
    
    # Добавляем поле keeper в таблицу tasks
    op.add_column('tasks', sa.Column('keeper', sa.Float(), nullable=False, server_default='0.0'))
    
    # Добавляем новое значение DISPUTE в enum TaskStatus
    op.execute("ALTER TYPE taskstatus ADD VALUE IF NOT EXISTS 'Спор' AFTER 'Закрытая'")


def downgrade() -> None:
    # Удаляем поле balance из таблицы users
    op.drop_column('users', 'balance')
    
    # Удаляем поле keeper из таблицы tasks
    op.drop_column('tasks', 'keeper')
    
    # Для enum нельзя просто удалить значение, поэтому оставляем его