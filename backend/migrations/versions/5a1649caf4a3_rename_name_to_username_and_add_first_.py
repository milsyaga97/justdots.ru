from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '5a1649caf4a3'
down_revision: Union[str, None] = '47a93ab0009f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.alter_column('blacklisted_tokens', 'token',
               existing_type=sa.TEXT(),
               type_=sa.String(),
               existing_nullable=False)
    op.drop_constraint('blacklisted_tokens_token_key', 'blacklisted_tokens', type_='unique')
    op.create_index(op.f('ix_blacklisted_tokens_token'), 'blacklisted_tokens', ['token'], unique=True)

    op.alter_column('users', 'name', new_column_name='username')

    op.add_column('users', sa.Column('first_name', sa.String(), nullable=False, server_default='Unknown'))
    op.add_column('users', sa.Column('last_name', sa.String(), nullable=False, server_default='Unknown'))
    op.add_column('users', sa.Column('patronymic', sa.String(), nullable=True))
    op.add_column('users', sa.Column('created_at', sa.DateTime(), nullable=True))

    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)

def downgrade() -> None:
    op.drop_index(op.f('ix_users_username'), table_name='users')

    op.drop_column('users', 'created_at')
    op.drop_column('users', 'patronymic')
    op.drop_column('users', 'last_name')
    op.drop_column('users', 'first_name')

    op.alter_column('users', 'username', new_column_name='name')

    op.drop_index(op.f('ix_blacklisted_tokens_token'), table_name='blacklisted_tokens')
    op.create_unique_constraint('blacklisted_tokens_token_key', 'blacklisted_tokens', ['token'])
    op.alter_column('blacklisted_tokens', 'token',
               existing_type=sa.String(),
               type_=sa.TEXT(),
               existing_nullable=False)