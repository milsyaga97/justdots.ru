from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'd1e4920698f8'
down_revision: Union[str, None] = '8822d5d2ee23'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.add_column('users', sa.Column('rating', sa.Float(), nullable=True))

def downgrade() -> None:
    op.drop_column('users', 'rating')