from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'f75b31c21ddc'
down_revision: Union[str, None] = 'd1e4920698f8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade():
    op.add_column("profiles", sa.Column("avatar_url", sa.String(), nullable=True))

def downgrade():
    op.drop_column("profiles", "avatar_url")
