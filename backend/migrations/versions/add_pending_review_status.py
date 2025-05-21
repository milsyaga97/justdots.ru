"""add pending review status

Revision ID: 333f65456d9c
Revises: b4f2c7d8e9a3
Create Date: 2024-03-20 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '333f65456d9c'
down_revision = 'b4f2c7d8e9a3'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Создаем временную таблицу с новым enum
    op.execute("ALTER TYPE taskstatus ADD VALUE 'На проверке заказчиком' AFTER 'В процессе'")

def downgrade() -> None:
    # PostgreSQL не поддерживает удаление значений из enum
    # Поэтому нужно пересоздать тип
    op.execute("""
    ALTER TABLE tasks 
    ALTER COLUMN status TYPE VARCHAR(255);
    """)
    
    op.execute("DROP TYPE taskstatus;")
    
    op.execute("""
    CREATE TYPE taskstatus AS ENUM (
        'На рассмотрении модерацией',
        'Отклонена модерацией',
        'Открытая',
        'В процессе',
        'Закрытая',
        'Спор'
    );
    """)
    
    op.execute("""
    ALTER TABLE tasks 
    ALTER COLUMN status TYPE taskstatus USING status::taskstatus;
    """) 