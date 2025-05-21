from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy import insert, table, column
from passlib.context import CryptContext
import bcrypt

revision: str = 'fbd090700c36'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def upgrade() -> None:
    op.create_table('users',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('name', sa.String(), nullable=False),
                    sa.Column('email', sa.String(), nullable=False),
                    sa.Column('hashed_password', sa.String(), nullable=False),
                    sa.Column('user_type', sa.Enum('CUSTOMER', 'FREELANCER', 'MODERATOR', name='usertype'),
                              nullable=False),
                    sa.Column('is_banned', sa.Boolean(), nullable=False, server_default='false'),
                    sa.Column('ban_expires_at', sa.DateTime(), nullable=True),
                    sa.PrimaryKeyConstraint('id')
                    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)

    hashed_password = bcrypt.hashpw("moderator123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    users_table = table(
        'users',
        column('id', sa.Integer),
        column('name', sa.String),
        column('email', sa.String),
        column('hashed_password', sa.String),
        column('user_type', sa.Enum('CUSTOMER', 'FREELANCER', 'MODERATOR', name='usertype'))
    )
    op.execute(
        users_table.insert().values({
            'id': 1,
            'name': 'Moderator',
            'email': 'moderator@example.com',
            'hashed_password': hashed_password,
            'user_type': 'MODERATOR'
        })
    )

def downgrade() -> None:
    op.drop_column('users', 'is_banned')
    op.execute('DELETE FROM users WHERE id = 1')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')